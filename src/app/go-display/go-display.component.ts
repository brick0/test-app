import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import * as go from 'gojs';

@Component({
  selector: 'app-go-display',
  templateUrl: './go-display.component.html',
  styleUrls: ['./go-display.component.css']
})

export class GoDisplayComponent implements OnInit {
  @ViewChild('rendererContainer')  element: ElementRef;
  diagram: go.Diagram;
  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit(){
     const $ = go.GraphObject.make;
     this.diagram = new go.Diagram("myDiagramDiv")
     this.diagram.model = new go.GraphLinksModel(
      [{ key:"1", label: "Hello" },   // two node data, in an Array
       { key:"2", label: "World!" }],
      [{ from: "1", to: "2"}]  // one link data, in an Array
    );

    this.createObjectTemplates()


  }
  createObjectTemplates(){
    const $ = go.GraphObject.make;
    let normalhost =
      $(go.Node, "Auto",  // the Shape automatically fits around the TextBlock
          $(go.Shape, "RoundedRectangle", {fill: "white"}),
          $(go.TextBlock, {margin: 3},  // some room around the text
              // bind TextBlock.text to Node.data.key
          new go.Binding("text", "label")),
          new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
          {
              click: console.log
          },
          {
            selectionAdornmentTemplate: $(go.Adornment, "Spot",
                $(go.Panel, "Auto",
                    $(go.Shape, {fill: null, stroke: "dodgerblue", strokeWidth: 3}),
                    $(go.Placeholder))
            )},  // end Adornment
        {
          contextMenu: $(go.Adornment, "Vertical",
            $("ContextMenuButton",
              $(go.TextBlock, "Expand BGP Neihbors"),
              {click:console.log}))
        }
      ); // end normal host
    this.diagram.linkTemplate = $(go.Link,       // the whole link panel
                $(go.Shape,
                    new go.Binding("stroke", "kind", function (k) {
                        return k == 'bgp' ? "red" : "blue"
                    }),
                    { click: console.log }
                ));
    let cloud = $(go.Node, "Auto",
                $(go.Shape, "Ellipse", {fill: "white"}),
                $(go.TextBlock,{margin: 3},
                  new go.Binding("text", "label")),
                new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify)
            );
    let templmap = new go.Map("string", go.Node);
    this.diagram.nodeTemplate = normalhost;
    templmap.add("cloud", cloud);
    templmap.add("host", normalhost);
    templmap.add("", this.diagram.nodeTemplate);
    this.diagram.nodeTemplateMap = templmap as go.Map<string, go.Part>;
  }


}
